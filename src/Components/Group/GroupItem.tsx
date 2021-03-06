import { IonButton, IonCard, IonCardContent, IonCardTitle, IonIcon } from '@ionic/react';
import { deleteDoc, doc } from 'firebase/firestore';
import { close } from 'ionicons/icons';
import { nanoid } from 'nanoid';
import React from 'react';
import { Droppable } from 'react-beautiful-dnd';
import styled from 'styled-components';
import { useGlobalContext } from '../../context/ContextProvider';
import { Tables, TypeGroup } from '../../Model/model';
import { useBoardContext } from '../Board/BoardContext';
import { CardItem } from '../Card/CardItem';
import '../style.css';
import { GroupCreateCard } from './GroupCreateCard';

type props = {
  group : TypeGroup
  groupIndex : string
  filter : string
}


const Container = styled.div`
`;
const TaskList = styled.div`
`;

export const GroupItem : React.FC<props> = ({filter, group, groupIndex: index}) => {
  const {firestore, setRefresh, user} = useGlobalContext();
  const {board} = useBoardContext();


  const onDelete = async ()=>{
    const refGroup = doc(firestore, Tables.Boards, board.uid as string, Tables.Groups, group.uid as string);
    await deleteDoc(refGroup);
    setRefresh(true);
  }

  if(!group) return null;

  return (
    <Container>
      <IonCard className='ion-padding groupItem'>
        <IonCardTitle>
          {
            board.boardMembers.includes(user.userUid) ?
            (<IonButton onClick={onDelete}>
              <IonIcon icon={close}  style={{padding:'0 !important'}}/>
            </IonButton>) :
            null
          }
          {group.groupName}
        </IonCardTitle>
        <IonCardContent>
          {
            board.boardMembers.includes(user.userUid) ?
            <GroupCreateCard group={group}/> :
            null
          }
          <Droppable droppableId={index} >
            { (provided) =>{
              return (
                <TaskList ref={provided.innerRef} {...provided.droppableProps} >
                  {group.groupCardUids.map((cardUid, cardIndex)=>{
                    return (
                      <CardItem filter={filter} key={nanoid()} cardUid={cardUid} index={cardIndex}/>
                    );
                  })}
                </TaskList>
              );
            }}
          </Droppable>
        </IonCardContent>
      </IonCard>
    </Container>
  );
};
