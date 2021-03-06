import { IonButton, IonContent, IonIcon, IonInput, IonItem, IonLabel, IonModal, IonSelect, IonSelectOption, IonTitle } from '@ionic/react';
import { collection, deleteDoc, doc, query, where, writeBatch } from 'firebase/firestore';
import { checkmarkCircle, closeCircle, settings } from 'ionicons/icons';
import { uniq } from 'lodash';
import { nanoid } from 'nanoid';
import React, { useState } from 'react';
import { useFirestoreCollectionData } from 'reactfire';
import { useGlobalContext } from '../../../context/ContextProvider';
import { BoardStatus, KeyBoard, Tables, TypeBoard, TypeWorkspace, WorkspaceVisibility } from '../../../Model/model';
import { useWorkspaceContext } from '../WorkspaceContext';

type props = {
  showModal : boolean,
  setShowModal : React.Dispatch<React.SetStateAction<boolean>>,
}

export const WorkspaceSettings : React.FC<props> = ({showModal, setShowModal}) => {
  const {firestore, user, setRefresh}= useGlobalContext();
  const {workspace} = useWorkspaceContext();
  const {history} = useGlobalContext();

  const [name, setName] = useState(workspace.workspaceName);
  const [description, setDescription] = useState(workspace.workspaceDescription);
  const [visibility, setVisibility] = useState(workspace.workspaceVisibility);

  const refWorkspace = doc(firestore, Tables.Workspaces, workspace.uid as string);

  const refBoards = collection(firestore, Tables.Boards);
  const {status : statusBoards, data : resBoards} = useFirestoreCollectionData(query(
      refBoards, 
      where(KeyBoard.boardWorkspaceUid, '==', workspace.uid as string)
      ), {
    idField: 'uid'
  })

  if(statusBoards === 'loading') return <>fetching data...</>

  const boards = resBoards as Array<TypeBoard>


  const onDelete = async ()=>{
    let deleteRequest = [...workspace.workspaceDeleteRequest, user.userUid];
    deleteRequest = uniq(deleteRequest); 
    const adminNotApproved = workspace.workspaceAdmins.filter((adminUid)=>{
      if(deleteRequest.includes(adminUid)) return false;
      return true;
    })
    if(adminNotApproved.length == 0){
      deleteDoc(refWorkspace);
      const batch = writeBatch(firestore);
      boards.forEach((board)=>{
        const refBoard = doc(firestore, Tables.Boards, board.uid as string);
        batch.update(refBoard, {
          boardStatus: BoardStatus.Close,
          boardWorkspaceUid: '',
        } as TypeBoard)
        console.info(board.boardName + ' closed');
      })
      batch.commit();
      alert('workspace deleted!');
      setRefresh(true);
      history.push('/workspace');
    }else{
      if(workspace.workspaceDeleteRequest.includes(user.userUid)) return;
      const batch = writeBatch(firestore);
      batch.update(refWorkspace, {
        workspaceDeleteRequest: deleteRequest,
        workspaceLogs:[
          ...workspace.workspaceLogs,
          `admin ${user.userName} has requested to delete workspace!`
        ]
      } as TypeWorkspace);
      await batch.commit();
      alert('announcement made');
    }
  };

  const onSave = async ()=>{
    try {
      const batch = writeBatch(firestore);
      const refWorkspace = doc(firestore, Tables.Workspaces, workspace.uid as string);
      batch.update(refWorkspace, {
        workspaceName: name,
        workspaceDescription: description,
        workspaceVisibility: visibility,
      } as TypeWorkspace);
      await batch.commit();
      setRefresh(true);
      alert('new settings saved');
    } catch (e) {
      alert('failed updating');
    }
  };

  return (
    <>
      <IonButton color="primary" onClick={()=>setShowModal(true)}>
        <IonIcon slot="icon-only" icon={settings} />
      </IonButton>
      <IonModal isOpen={showModal} onDidDismiss={()=>setShowModal(false)}>
        <IonItem>
          <IonButton onClick={()=>setShowModal(false)}>
            <IonIcon icon={closeCircle} />
          </IonButton>
          <IonTitle size='large'>settings for {workspace.workspaceName}</IonTitle>
        </IonItem>
        <IonContent>

          <IonItem>
            <IonLabel position='fixed'>Name</IonLabel>
            <IonInput
              type='text'
              value={name}
              onIonChange={((e)=>{
                setName(e.detail.value as string);
              })}
            />
          </IonItem>
          <IonItem>
            <IonLabel position='fixed'>
              Visibility
            </IonLabel>
            <IonSelect
              interface='popover'
              value={visibility}
              onIonChange={(e)=>{
                setVisibility(e.detail.value);
              }}
            >
              {
                Object.keys(WorkspaceVisibility).map((visibility)=>{
                  return (
                    <IonSelectOption
                      key={nanoid()}
                      value={visibility}
                    >{visibility}</IonSelectOption>);
                })
              }
            </IonSelect>
          </IonItem>
          <IonItem>
            <IonLabel position='fixed'>Description</IonLabel>
            <IonInput
              type='text'
              value={description}
              onIonChange={((e)=>{
                setDescription(e.detail.value as string);
              })}
            />
          </IonItem>
          <IonButton onClick={onSave}>
            save
          </IonButton>
          <IonItem>
            <IonTitle className='ion-text-center'>
            Delete workspace {workspace.workspaceName}?
            </IonTitle>
            <IonItem style={{width: '100%'}}>
              <IonButton color='primary' onClick={()=>setShowModal(false)}>
                <IonIcon icon={closeCircle} />
              </IonButton>
              <IonButton color='danger' onClick={onDelete}>
                <IonIcon icon={checkmarkCircle} />
              </IonButton>
            </IonItem>
          </IonItem>
        </IonContent>
      </IonModal>
    </>
  );
};
